"use strict"

function CreateRotateX_4x4 (radian)
{
        return Matrix.create([
                [1,                0,                 0, 0],
                [0, Math.cos(radian), -Math.sin(radian), 0],
                [0, Math.sin(radian),  Math.cos(radian), 0],
                [0,                0,                 0, 1]
        ]);
}

function CreateRotateY_4x4 (radian)
{
        return Matrix.create([
                [ Math.cos(radian), 0, Math.sin(radian), 0],
                [                0, 1,                0, 0],
                [-Math.sin(radian), 0, Math.cos(radian), 0],
                [                0, 0,                0, 1]
        ]);
}

function CreateRotateZ_4x4 (radian)
{
        return Matrix.create([
                [Math.cos(radian), -Math.sin(radian), 0, 0],
                [Math.sin(radian),  Math.cos(radian), 0, 0],
                [               0,                 0, 1, 0],
                [               0,                 0, 0, 1],
        ]);
}

function CalcWorldMatrix (bone_idx, parent_world_mtx)
{
        var local_translation = Matrix.create([
                [1, 0, 0, g_bones[bone_idx][g_BONE_LOCAL_POSITION][0]],
                [0, 1, 0, g_bones[bone_idx][g_BONE_LOCAL_POSITION][1]],
                [0, 0, 1, g_bones[bone_idx][g_BONE_LOCAL_POSITION][2]],
                [0, 0, 0, 1]
        ]);

        var local_rotation = Matrix.I(4);
        local_rotation = local_rotation.multiply(CreateRotateZ_4x4(g_bones[bone_idx][g_BONE_LOCAL_ROTATION][2]));
        local_rotation = local_rotation.multiply(CreateRotateY_4x4(g_bones[bone_idx][g_BONE_LOCAL_ROTATION][1]));
        local_rotation = local_rotation.multiply(CreateRotateX_4x4(g_bones[bone_idx][g_BONE_LOCAL_ROTATION][0]));

        var world_mtx = Matrix.I(4);
        world_mtx = world_mtx.multiply(parent_world_mtx);
        world_mtx = world_mtx.multiply(local_translation);
        world_mtx = world_mtx.multiply(local_rotation);

        g_bones[bone_idx][g_BONE_WORLD_MTX] = world_mtx;

        if (g_bones[bone_idx][g_BONE_CHILDREN])
        {
                for (var idx in g_bones[bone_idx][g_BONE_CHILDREN])
                {
                        var child_bone_idx = g_bones[bone_idx][g_BONE_CHILDREN][idx];
                        CalcWorldMatrix(child_bone_idx, world_mtx);
                }
        }
}

function CalcWorldPosition (vertex_idx, root_pose)
{
	var vertex_position_model = Vector.create([
		g_skin_vertices[vertex_idx][g_VERTEX_POSITION][0],
		g_skin_vertices[vertex_idx][g_VERTEX_POSITION][1],
		g_skin_vertices[vertex_idx][g_VERTEX_POSITION][2],
		1.0
	]);

	var vertex_normal_model = Vector.create([
		g_skin_vertices[vertex_idx][g_VERTEX_NORMAL][0],
		g_skin_vertices[vertex_idx][g_VERTEX_NORMAL][1],
		g_skin_vertices[vertex_idx][g_VERTEX_NORMAL][2],
		0.0
	]);

	var vertex_position_world = Vector.Zero(4);
        var vertex_normal_world = Vector.Zero(4);
	var weights_info = g_skin_vertices[vertex_idx][g_VERTEX_WEIGHTS];

	for (var idx = 0; idx < weights_info.length; ++idx)
	{
                alert(weights_info[idx]);
		var bone_idx = weights_info[idx][g_WEIGHT_BONE];
                var weight = weights_info[idx][g_WEIGHT_VALUE];
		
		var bone_world_mtx = g_bones[bone_idx][g_BONE_WORLD_MTX];
		var binding_mtx = g_bones[bone_idx][g_BONE_BINDING_MTX];
		var binding_mtx_inverse = binding_mtx.inverse();

		var temp_position = binding_mtx_inverse.multiply(vertex_position_model);
		temp_position = bone_world_mtx.multiply(temp_position).multiply(weight);
		vertex_position_world = vertex_position_world.add(temp_position);

                var temp_normal = binding_mtx_inverse.multiply(vertex_normal_model);
                temp_normal = bone_world_mtx.multiply(temp_normal).multiply(weight);
                vertex_normal_world = vertex_normal_world.add(temp_normal);
	}

        alert(vertex_position_world.inspect());
        alert(vertex_normal_world.inspect());

        return [vertex_position_world, vertex_normal_world];
}
